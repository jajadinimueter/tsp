function shuffle(array) {
    var currentIndex = array.length, 
        temporaryValue, 
        randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
    
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function create_matrix(nx, ny) {
    var x = [];
    for (var i=0; i<ny; i++) {
        var y = [];
        for (var j=0; j<nx; j++) {
            y.push(0);
        }
        x.push(y);
    }
    return x;
}

function generate_random_points(n, xmax, ymax){
    var x = create_matrix(2, n);    
    for(var i=0; i<n; i++) {
        x[i][0] = Math.floor(Math.random() * xmax);
        x[i][1] = Math.floor(Math.random() * ymax);
    }
    return x;
};

function draw_points(ctx, points) {
    var recsize = 6;
    var rs = recsize/2;
    for (var i=0; i<points.length; i++) {
        var point = points[i];
        ctx.fillRect(point[0]-rs,point[1]-rs,recsize,recsize);
    }
}

function generate_initial_population(pop_size, num_points) {
    var population = [];
    for (var i=0; i<pop_size; i++) {
        var chromosome = [];
        for (var j=0; j<num_points; j++) {
            chromosome.push(j);
        }
        // shuffle chromosome
        population.push(shuffle(chromosome));
    }
    return population;
}

function generate_distance_map(points) {
    // generates a matrix where you may be able
    // to get distance between p1 and p2 by
    // dmap[p1][p2]
    
    var dmap = [];
    for(var i=0; i<points.length; i++) {
        var p1 = points[i];
        var dmap_entry = [];   
        for(var j=0; j<points.length; j++) {
            if ( j == i ) {
                dmap_entry.push(0);
            } else {
                var p2 = points[j];
                var dist = Math.pow(p1[0]-p2[0], 2)+
                                Math.pow(p1[1]-p2[1], 2);
                dist = Math.sqrt(dist);
                dmap_entry.push(dist);
            }
        }
        dmap.push(dmap_entry);
    }
    return dmap;
}

function calculate_sums(pop, dmap) {
    // calculates all paths of the population
    // and returns the shortest as well
    var shortest = [NaN, Number.MAX_VALUE];
    var sums = [];
    for (var i=0; i<pop.length; i++){
        var sum = 0;
        var chromo = pop[i];
        for(var j=0; j<chromo.length-1; j++) {
            sum += dmap[chromo[j]][chromo[j+1]];
        }
        sums[i] = sum;
        if ( sum < shortest[1] ) {
            shortest = [i, sum];
        }
    }
    return [sums, shortest];
}

function draw_lines(ctx, pop, points, style, line_width) {
    ctx.strokeStyle = style || 'blue';
    ctx.lineWidth = line_width || 1;
    for(var i=0; i<pop.length; i++) {
        ctx.beginPath();
        var chromo = pop[i];
        for (var j=0; j<chromo.length; j++) {
            var pn = chromo[j];
            var xy = points[pn]; 
            if ( j > 0 ) {
                ctx.lineTo(xy[0], xy[1]); 
            }
            ctx.moveTo(xy[0], xy[1]);
        }
        ctx.stroke(); 
    }
}

function array_copy(arr) {
    return arr.slice(0, arr.length);
}

function swap_mutate(p) {
    p = array_copy(p);
    var l = p.length;
    s1 = Math.floor(Math.random() * l);
    s2 = Math.floor(Math.random() * l);
    var t = p[s2];
    p[s2] = p[s1];
    p[s1] = t;
    return p;
}

function flip_mutate(p) {
    p = array_copy(p);
    var l = p.length;
    s1 = Math.floor(Math.random() * l);
    s2 = Math.floor(Math.random() * l);
    var cuts = [s1, s2];
    cuts.sort();
    s1 = cuts[0];
    s2 = cuts[1];
    var seg = p.slice(s1, s2).reverse();
    for(var j=0; j<seg.length; j++) {
        p[j+s1] = seg[j];
    }
    return p;
}

function slide_mutate(porig) {
    p = array_copy(porig);
    var l = p.length;
    s1 = Math.floor(Math.random() * l);
    s2 = Math.floor(Math.random() * l);
    var cuts = [s1, s2];
    cuts.sort();
    s1 = cuts[0];
    s2 = cuts[1];
    var seg = p.slice(s1, s2);
    if ( seg.length > 0 ) {
        for(var j=0; j<seg.length-1; j++) {
            p[j+s1] = seg[j+1];
        }
        p[s2-1] = seg[0];
    }
    return p;
}


function array_contains(arr, item) {
    for(var i=0; i<arr.length; i++) {
        if ( arr[i] == item) {
            return true;
        }
    }
    return false;
}


function ox1_initial_parent(c, p, s1, s2) {
    for(var i=s1; i<s2; i++) {
        c[i] = p[i];
    }
}


function ox1_fill_rest(c, p, s2) {
    var plen = p.length;
    var cidx = s2;
    for (var i=0; i<plen; i++) {
        var idx = i + s2;
        if ( idx >= plen ) {
            idx = idx - plen;
        }  
        var pi = p[idx];
        if ( !array_contains(c, pi) ) {
            if ( cidx >= plen ) {
                cidx = cidx - plen;
            }
            c[cidx] = pi;
            cidx++;
        } 
    }
}


function cross_ox1(p1, p2) {
    var l = p1.length;
    var s1 = Math.floor(Math.random() * l);
    var s2 = Math.floor(Math.random() * l);
    if ( s1 == s2 ) {
        // dont bother with the algo
        return [p1, p2];
    } else {
        // do the crossover 
        var c1 = create_matrix(l, 1);
        var c2 = create_matrix(l, 1);
        ox1_initial_parent(c1, p2, s1, s2);
        ox1_initial_parent(c2, p1, s1, s2);
        ox1_fill_rest(c1, p1, s2);
        ox1_fill_rest(c2, p2, s2);
        return [c1, c2];
    }       
}

var ox1_crossover = function(pop, dmap, points, config_fn) {
    this.pop = pop;
    this.min_length = Number.MAX_VALUE;
    this.best = null;
    this.next_generation = function() {
        var config = config_fn();
        var rate = config['rate'] || 0.5;
        var out_of = config['p_out_of'] || 0.5;
        var p_better_bonus = config['p_better_bonus'] || 1;
        this.pop = shuffle(this.pop);
        var plen = this.pop.length;
        var new_pop = [];
        for (var i=0; i<plen; i++){  
            if ( i + out_of < plen ) {
                var p1 = this.pop[i];
                var pl2 = this.pop.slice(i+1,i+out_of);
                var sums = calculate_sums(pl2, dmap);
                var ibest = sums[1][0];
                var rander = [];
                for (var j=0; j<p_better_bonus; j++) {
                    rander.push(ibest);
                }
                // everyone else one time
                for (var j=0; j<out_of-1; j++) {
                    rander.push(j);
                }
                var p2 = pl2[rander[
                    Math.floor(Math.random()*rander.length)]];
            
                new_pop.push(p1);
                // do the crossover between p1 and p2 
                for (var j=0; j<pl2.length; j++){
                    new_pop.push(pl2[j]);
                }
 
                children = cross_ox1(p1, p2); 
                for(var j=0; j<children.length; j++) {
                    new_pop.push(children[j]);
                }
            }
        }

        // mutate some according to mutation rate
        var nplen = new_pop.length;
        var mut_count=nplen * rate;
        for(var i=0; i<mut_count; i++) {
            var ix = Math.floor(Math.random() * nplen);
            var ind = new_pop[ix];
            var kind = Math.floor(Math.random() * 2);
            if ( kind == 0 ) {  
                ind = swap_mutate(ind);
            } else if ( kind == 1 ) {
                ind = flip_mutate(ind);
            } else if ( kind == 2 ) {
                ind = slide_mutate(ind);
            }
            new_pop[ix] = ind;
        } 
        
        this.pop = new_pop;        

        return this.pop;
    };
};

var best_mutate = function(pop, dmap, points, config_fn) {
    this.pop = pop;
    this.min_length = Number.MAX_VALUE;
    this.best = null;
    this.next_generation = function() {
        var config = config_fn();
        var best_of = config['best_of'] || 4;
        var mutate = config['mutate'] || 3;
        var mutate_count = config['mutate_count'] || 1;
        if ( mutate > best_of - 1 ) {
            mutate = best_of - 1;
        }
        this.pop = shuffle(this.pop);
        var new_pop = [];
        for (var i=best_of-1; i<this.pop.length; i+=(best_of-1)) {
            var seg = this.pop.slice(i-(best_of-1), i);
            var sums = calculate_sums(seg, dmap);
            var ibest = sums[1][0];
            var best = seg[ibest];
            new_pop.push(best);
            // mutate the best
            for (var j=0; j<mutate; j++) {
                if ( j % 3 == 0 ) {
                    new_pop.push(swap_mutate(best));                 
                } else if ( j % 3 == 1 ) {
                    new_pop.push(flip_mutate(best));                 
                } else if ( j % 3 == 2 ) {
                    new_pop.push(slide_mutate(best));                 
                }
            }
        }
        var lendiff = new_pop.length - this.pop.length;
        if (lendiff < 0) {
            for (var i=0; i<Math.abs(lendiff); i++) {
                new_pop.push(pop[i]);
            }
        } else if ( lendiff > 0 ) {
            for (var i=0; i<Math.abs(lendiff); i++) {
                new_pop.pop(); 
            }    
        }
        this.pop = new_pop;
        return this.pop; 
    };   
};

